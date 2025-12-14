module KREDITH::umkm_reputation {
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::package;
    use iota::display;
    use std::string::{Self, String};

    public struct UMKM_REPUTATION has drop {}


    public struct KredithScore has key { 
        id: UID,
        name: String,
        category: String,
        revenue: u64,
        tier: String,      // Bronze/Silver/Gold
        image_url: String  // Assets
    }

    fun init(otw: UMKM_REPUTATION, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"image_url"),
            string::utf8(b"description"),
        ];

        let values = vector[
            string::utf8(b"{name} - {tier} Badge"),
            string::utf8(b"{image_url}"),
            string::utf8(b"Reputasi Kredith Terverifikasi untuk {category}"),
        ];

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<KredithScore>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    public entry fun register(name: String, category: String, ctx: &mut TxContext) {
        let nft = KredithScore {
            id: object::new(ctx),
            name: name,
            category: category,
            revenue: 0,
            tier: string::utf8(b"Bronze"),
            image_url: string::utf8(b"https://cdn-icons-png.flaticon.com/128/14458/14458082.png") 
        };
        transfer::transfer(nft, tx_context::sender(ctx));
    }

    public entry fun record_revenue(score: &mut KredithScore, amount: u64, _ctx: &mut TxContext) {
        score.revenue = score.revenue + amount;

        if (score.revenue > 100000000) {
            score.tier = string::utf8(b"Gold");
            score.image_url = string::utf8(b"https://cdn-icons-png.flaticon.com/128/14458/14458116.png");
        } else if (score.revenue > 10000000) {
            score.tier = string::utf8(b"Silver");
            score.image_url = string::utf8(b"https://cdn-icons-png.flaticon.com/128/14457/14457452.png");
        };
    }
}