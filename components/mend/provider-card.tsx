import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { SearchProvider } from "@/lib/types";
import { providerPhotoUrl } from "@/lib/storage";
import { formatPrice } from "@/lib/format";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProviderCard({
  provider,
  categoryName,
}: {
  provider: SearchProvider;
  categoryName: string;
}) {
  const photo = providerPhotoUrl(provider.photo_path);

  return (
    <Link
      href={`/providers/${provider.user_id}`}
      className="tag block transition-colors hover:border-primary"
    >
      <div className="mb-4 overflow-hidden rounded-photo bg-slate-100">
        {photo ? (
          <Image
            src={photo}
            alt={`Photo of ${categoryName} work by ${provider.display_name}`}
            width={640}
            height={480}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-slate-100">
            <span className="font-display text-4xl font-bold text-slate-500">
              {initials(provider.display_name)}
            </span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold">{provider.display_name}</h3>
        <p className="mt-1 text-sm text-muted">{categoryName}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {provider.service_districts.join(", ")}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-bold tabular-nums">
            {provider.price_note || formatPrice(null)}
          </span>
          <span className="text-sm font-bold text-primary">View profile</span>
        </div>
      </div>
    </Link>
  );
}
