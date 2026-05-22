type Props = {
  version: number;
  current: boolean;
};

export function VersionBadge({ version, current }: Props) {
  return (
    <span className={`version-badge${current ? " version-badge--current" : ""}`}>
      v{version} {current ? "current" : "archived"}
    </span>
  );
}
