interface DetailTableProps {
  fields: Array<[string, string | number | null | undefined]>;
}

const DetailTable = ({ fields }: DetailTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Field</th>
            <th className="px-4 py-3 font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(([label, value]) => (
            <tr key={label} className="border-t border-border align-top">
              <th className="w-1/3 bg-muted/30 px-4 py-3 text-left font-medium text-foreground">{label}</th>
              <td className="px-4 py-3 text-muted-foreground">{value != null && value !== "" ? value : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DetailTable;
