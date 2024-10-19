import { TOTP, Secret } from "otpauth";
import QR from "@paulmillr/qr";

const $settings = /** @type {HTMLFormElement} */ (document.querySelector("#settings"));
const $code = /** @type {HTMLInputElement} */ (document.querySelector("#code"));
const $counter = /** @type {HTMLDivElement} */ (document.querySelector("#counter"));
const $uri = /** @type {HTMLInputElement} */ (document.querySelector("#uri"));
const $qr = /** @type {HTMLImageElement} */ (document.querySelector("#qr"));

let totp = null;

const generate = () => {
  if (!$settings.checkValidity()) return;

  const settings = new FormData($settings);
  totp = new TOTP({
    issuer: settings.get("issuer")?.toString(),
    label: settings.get("label")?.toString(),
    algorithm: settings.get("algorithm")?.toString(),
    digits: Number.parseInt(settings.get("digits")?.toString(), 10),
    period: Number.parseInt(settings.get("period")?.toString(), 10),
    secret: settings.get("secret")?.toString(),
  });

  $code.value = totp.generate();
  $uri.value = totp.toString();

  const qr = QR($uri.value, "svg", { ecc: "low", scale: 1, border: 1 });
  $qr.src = URL.createObjectURL(new Blob([qr], { type: "image/svg+xml" }));
};

const progress = () => {
  if (!totp) return;

  $code.value = totp.generate();

  const remaining = totp.period - (Math.floor(Date.now() / 1000) % totp.period);
  $counter.style.width = `${(remaining / totp.period) * 100}%`;
  $counter.setAttribute("aria-valuenow", remaining.toString());
};

$settings.addEventListener("input", () => generate());
$settings.addEventListener("change", () => $settings.reportValidity());

$settings.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement) {
    const nextSibling = event.target.nextElementSibling;
    if (nextSibling instanceof HTMLOutputElement) {
      const digits = event.target.step.split(".")?.[1]?.length ?? 0;
      const value = Number.parseFloat(event.target.value).toFixed(digits);
      nextSibling.value = value;
    }
  }
});

$code.addEventListener("focus", () => $code.select());
$uri.addEventListener("focus", () => $uri.select());

$settings["secret"].value = new Secret().base32;

generate();
progress();

setInterval(() => progress(), 1000);
