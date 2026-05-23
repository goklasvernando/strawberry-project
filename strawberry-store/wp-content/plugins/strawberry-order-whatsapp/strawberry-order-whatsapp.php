<?php
/**
 * Plugin Name: Strawberry Order WhatsApp
 * Description: Menambahkan payment method "Other" dan kirim notifikasi nota WhatsApp untuk admin dan pelanggan saat order WooCommerce dibuat.
 * Version: 1.0.0
 * Author: Strawberry Store
 */

if (!defined('ABSPATH')) {
    exit;
}

class Strawberry_Order_WhatsApp {
    private const OPTION_NAME = 'strawberry_wa_settings';

    public function __construct() {
        add_action('plugins_loaded', [$this, 'init']);
    }

    public function init(): void {
        if (!class_exists('WooCommerce')) {
            return;
        }

        add_filter('woocommerce_payment_gateways', [$this, 'register_gateway']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('woocommerce_checkout_order_processed', [$this, 'send_whatsapp_notifications'], 20, 3);
    }

    public function register_gateway(array $gateways): array {
        require_once __DIR__ . '/src/class-wc-gateway-strawberry-other.php';
        $gateways[] = 'WC_Gateway_Strawberry_Other';
        return $gateways;
    }

    public function register_settings(): void {
        register_setting(self::OPTION_NAME, self::OPTION_NAME, [$this, 'sanitize_settings']);

        add_settings_section(
            'strawberry_wa_main',
            'WhatsApp Gateway Settings',
            function () {
                echo '<p>Gunakan endpoint provider WhatsApp API (misalnya Fonnte/Twilio/Meta BSP) untuk kirim nota otomatis.</p>';
            },
            self::OPTION_NAME
        );

        $fields = [
            'api_endpoint' => 'API Endpoint URL',
            'api_token' => 'API Token',
            'admin_phone' => 'Nomor Admin (format internasional, contoh: 62812xxxx)',
            'send_to_customer' => 'Kirim ke pelanggan juga',
        ];

        foreach ($fields as $key => $label) {
            add_settings_field(
                $key,
                $label,
                [$this, 'render_field'],
                self::OPTION_NAME,
                'strawberry_wa_main',
                ['key' => $key, 'label' => $label]
            );
        }
    }

    public function sanitize_settings(array $input): array {
        return [
            'api_endpoint' => esc_url_raw($input['api_endpoint'] ?? ''),
            'api_token' => sanitize_text_field($input['api_token'] ?? ''),
            'admin_phone' => preg_replace('/[^0-9]/', '', $input['admin_phone'] ?? ''),
            'send_to_customer' => !empty($input['send_to_customer']) ? '1' : '0',
        ];
    }

    public function register_menu(): void {
        add_submenu_page(
            'woocommerce',
            'Strawberry WhatsApp',
            'Strawberry WhatsApp',
            'manage_woocommerce',
            'strawberry-whatsapp',
            [$this, 'settings_page']
        );
    }

    public function settings_page(): void {
        if (!current_user_can('manage_woocommerce')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1>Strawberry WhatsApp Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields(self::OPTION_NAME);
                do_settings_sections(self::OPTION_NAME);
                submit_button();
                ?>
            </form>
            <hr />
            <h2>Template Nota</h2>
            <pre>Nama: {nama}
No HP: {no_hp}
Alamat: {alamat}
Pesanan: {pesanan}
Pembayaran: {pembayaran}</pre>
        </div>
        <?php
    }

    public function render_field(array $args): void {
        $settings = get_option(self::OPTION_NAME, []);
        $key = $args['key'];
        $value = $settings[$key] ?? '';

        if ($key === 'send_to_customer') {
            echo '<label><input type="checkbox" name="' . esc_attr(self::OPTION_NAME) . '[send_to_customer]" value="1" ' . checked($value, '1', false) . '> Aktif</label>';
            return;
        }

        $type = $key === 'api_token' ? 'password' : 'text';
        echo '<input type="' . esc_attr($type) . '" class="regular-text" name="' . esc_attr(self::OPTION_NAME) . '[' . esc_attr($key) . ']" value="' . esc_attr($value) . '" />';
    }

    public function send_whatsapp_notifications(int $order_id, array $posted_data, WC_Order $order): void {
        $settings = get_option(self::OPTION_NAME, []);
        $endpoint = $settings['api_endpoint'] ?? '';
        $token = $settings['api_token'] ?? '';

        if (empty($endpoint) || empty($token)) {
            return;
        }

        $message = $this->build_order_note($order);

        $targets = [];
        if (!empty($settings['admin_phone'])) {
            $targets[] = $settings['admin_phone'];
        }

        if (($settings['send_to_customer'] ?? '0') === '1') {
            $customer_phone = preg_replace('/[^0-9]/', '', (string) $order->get_billing_phone());
            if (!empty($customer_phone)) {
                $targets[] = $customer_phone;
            }
        }

        foreach (array_unique($targets) as $phone) {
            $this->send_api_request($endpoint, $token, $phone, $message, $order_id);
        }
    }

    private function build_order_note(WC_Order $order): string {
        $items_text = [];
        foreach ($order->get_items() as $item) {
            $product_name = $item->get_name();
            $variation_name = wc_get_formatted_variation($item->get_product(), true, false, true);
            $gram = $this->extract_gram($variation_name . ' ' . $product_name);
            $category = $this->get_first_product_category($item);
            $items_text[] = trim($category . ' / ' . ($gram ?: 'N/A'));
        }

        $name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
        $phone = $order->get_billing_phone();
        $address = trim($order->get_billing_address_1() . ', ' . $order->get_billing_city());
        $payment = $order->get_payment_method_title();

        return "Nama: {$name}\n"
            . "No HP: {$phone}\n"
            . "Alamat: {$address}\n"
            . "Pesanan: " . implode(', ', $items_text) . "\n"
            . "Pembayaran: {$payment}";
    }

    private function get_first_product_category(WC_Order_Item_Product $item): string {
        $product = $item->get_product();
        if (!$product) {
            return 'Strawberry';
        }

        $terms = get_the_terms($product->get_id(), 'product_cat');
        if (is_array($terms) && !empty($terms)) {
            return $terms[0]->name;
        }

        return 'Strawberry';
    }

    private function extract_gram(string $text): string {
        if (preg_match('/(\d+(?:[\.,]\d+)?)\s*(g|gram|grams|kg)/i', $text, $matches)) {
            return $matches[1] . ' ' . strtolower($matches[2]);
        }
        return '';
    }

    private function send_api_request(string $endpoint, string $token, string $phone, string $message, int $order_id): void {
        $args = [
            'timeout' => 20,
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode([
                'target' => $phone,
                'message' => $message,
                'order_id' => $order_id,
            ]),
        ];

        $response = wp_remote_post($endpoint, $args);

        if (is_wp_error($response)) {
            wc_get_logger()->error(
                'WA send failed: ' . $response->get_error_message(),
                ['source' => 'strawberry-order-whatsapp']
            );
            return;
        }

        wc_get_logger()->info(
            'WA sent to ' . $phone . ' for order #' . $order_id,
            ['source' => 'strawberry-order-whatsapp']
        );
    }
}

new Strawberry_Order_WhatsApp();
