"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: string;
  options: { value: string; label: string; href: string }[];
};

export function SortSelect({ value, options }: Props) {
  const router = useRouter();

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const option = options.find((o) => o.value === next);
        if (option) router.push(option.href, { scroll: false });
      }}
    >
      <SelectTrigger className="w-48" aria-label="Sort products">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
