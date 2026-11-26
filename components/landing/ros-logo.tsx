import Image from "next/image";

/**
 * The public brand mark. The asset is a file so the designed ROS logo can be
 * dropped in without changing any of the shells that use it.
 */
export function RosLogo() {
  return (
    <span className="l-brand-mark" aria-hidden>
      <Image
        src="/ros-logo.svg"
        alt=""
        width={26}
        height={26}
        unoptimized
        priority
      />
    </span>
  );
}
