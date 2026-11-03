import robot from "@/assets/mini-robot.png.asset.json";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <img
      src={robot.url}
      alt="Mini robot"
      width={size}
      height={size}
      className="shrink-0 object-contain drop-shadow-[0_0_10px_var(--glow-violet)]"
      style={{ width: size, height: size }}
    />
  );
}
