export default function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-block border-2 border-white/30 border-t-white rounded-full animate-spin"
    />
  );
}
