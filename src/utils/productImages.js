import { assetUrl } from "../services/api";
import accessories from "../assets/accessories.jpg";
import rackOrganizer from "../assets/rack-organizer.jpg";
import tshirt from "../assets/t-shirt.jpg";
import earphones from "../assets/earphones.jpg";
import mattress from "../assets/mattress.jpg";
import eyeglasses from "../assets/eyeglasses.jpg";
import miniFan from "../assets/mini-fan.jpg";
import waterBottle from "../assets/water-bottle.jpg";
import deskLamp from "../assets/desk-lamp.jpg";
import backpack from "../assets/backpack.jpg";
import mouse from "../assets/wireless-mouse.jpg";
import mug from "../assets/ceramic-mug.jpg";
import phoneStand from "../assets/phone-stand.jpg";
import makeupOrganizer from "../assets/makeup-organizer.jpg";
import stringLights from "../assets/led-string-lights.jpg";
import storageBox from "../assets/foldable-storage-box.jpg";

const BY_NAME = {
    "Moving Rack Organizer": rackOrganizer,
    "Oversized Trend T-Shirt": tshirt,
    "Wireless Bluetooth Earphones": earphones,
    "Double Mattress Foam": mattress,
    "Eyeglasses With Graded Lens": eyeglasses,
    "Portable Mini Fan": miniFan,
    "Stainless Steel Water Bottle": waterBottle,
    "LED Desk Lamp": deskLamp,
    "Laptop Backpack": backpack,
    "Wireless Mouse": mouse,
    "Cute Ceramic Mug": mug,
    "Phone Stand": phoneStand,
    "Makeup Organizer": makeupOrganizer,
    "LED String Lights": stringLights,
    "Foldable Storage Box": storageBox
};

// Uses the uploaded image when there is one, otherwise a bundled picture.
export function getProductImage(name, imageUrl) {
    return assetUrl(imageUrl) || BY_NAME[name] || accessories;
}
