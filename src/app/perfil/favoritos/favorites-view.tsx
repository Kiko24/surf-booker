"use client";

import Link from "next/link";
import type { FavoriteSchool } from "../actions";

export function FavoritesView({ schools }: { schools: FavoriteSchool[] }) {
  if (schools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-400">
          Ainda não tem escolas favoritas. Explore as escolas e adicione aos favoritos!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schools.map(s => (
        <Link
          key={s.id}
          href={`/escolas/${s.slug}`}
          className="group rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:shadow-sm"
        >
          <div className="mb-3 flex items-center gap-3">
            {s.logoUrl ? (
              <img
                src={s.logoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-500">
                {s.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-accent transition-colors">
                {s.name}
              </h3>
              {s.location && (
                <p className="text-xs text-gray-400">{s.location}</p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
