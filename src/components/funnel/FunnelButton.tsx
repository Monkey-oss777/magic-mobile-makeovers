import type { ButtonHTMLAttributes } from "react";

export default function FunnelButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />;
}