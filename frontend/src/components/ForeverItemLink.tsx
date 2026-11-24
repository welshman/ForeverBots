interface ForeverItemLinkProps {
  itemId: number;
  name?: string;
}

export default function ForeverItemLink({
  itemId,
  name,
}: ForeverItemLinkProps) {
  const label = name?.trim() || `Item #${itemId}`;

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    return <span>{label}</span>;
  }

  return (
    <a
      href={`https://www.wowhead.com/forever/item=${itemId}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`View ${label} on Wowhead Forever`}
      aria-label={`${label} on Wowhead Forever`}
      className="text-gold-400 hover:underline focus-visible:outline focus-visible:outline-2"
    >
      {label}
    </a>
  );
}
