<?php

if (!defined('ABSPATH')) {
    exit;
}

class WC_Gateway_Strawberry_Other extends WC_Payment_Gateway {
    public function __construct() {
        $this->id = 'strawberry_other';
        $this->icon = '';
        $this->has_fields = false;
        $this->method_title = 'Other';
        $this->method_description = 'Metode pembayaran manual lainnya.';

        $this->init_form_fields();
        $this->init_settings();

        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');
        $this->enabled = $this->get_option('enabled');

        add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
    }

    public function init_form_fields(): void {
        $this->form_fields = [
            'enabled' => [
                'title' => 'Enable/Disable',
                'type' => 'checkbox',
                'label' => 'Aktifkan metode pembayaran Other',
                'default' => 'yes',
            ],
            'title' => [
                'title' => 'Title',
                'type' => 'text',
                'description' => 'Judul yang tampil di checkout.',
                'default' => 'Other',
                'desc_tip' => true,
            ],
            'description' => [
                'title' => 'Description',
                'type' => 'textarea',
                'description' => 'Deskripsi metode pembayaran.',
                'default' => 'Silakan hubungi admin untuk konfirmasi pembayaran metode Other.',
            ],
            'instructions' => [
                'title' => 'Instructions',
                'type' => 'textarea',
                'description' => 'Instruksi di halaman terima kasih / email.',
                'default' => 'Admin akan menghubungi Anda untuk detail pembayaran.',
            ],
        ];
    }

    public function process_payment($order_id): array {
        $order = wc_get_order($order_id);
        $order->update_status('on-hold', 'Menunggu pembayaran via metode Other.');
        $order->reduce_order_stock();
        WC()->cart->empty_cart();

        return [
            'result' => 'success',
            'redirect' => $this->get_return_url($order),
        ];
    }
}
