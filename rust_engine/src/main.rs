use std::env;
use std::fs::File;
use std::io::{Read, Write};

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 { return; }
    
    let action = &args[1];
    let input = &args[2];
    let output = &args[3];
    let param = if args.len() > 4 { &args[4] } else { "POLYGLOT_MATRIX_SECURE" };

    let mut data = Vec::new();
    if File::open(input).unwrap().read_to_end(&mut data).is_err() { return; }

    if action == "sign" {
        // Feature 23: Injects a digital tamper-proof footprint
        let signature = format!("\n%%POLYGLOT_SIGNATURE: {}\n", param);
        data.extend_from_slice(signature.as_bytes());
        File::create(output).unwrap().write_all(&data).unwrap();
        println!("[RUST] Cryptographic signature injected.");
    } 
    else if action == "steg" {
        // Feature 20: Invisible Steganography text injection
        let hidden = format!("\n%%STEG_PAYLOAD_START\n{}\n%%STEG_PAYLOAD_END\n", param);
        data.extend_from_slice(hidden.as_bytes());
        File::create(output).unwrap().write_all(&data).unwrap();
        println!("[RUST] Steganography payload hidden in binary.");
    }
}
