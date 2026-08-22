function PolarizedList(props: {
  items: ([string, string] | false | undefined)[];
}) {
  return (
    <div className="flex items-start justify-center gap-4 self-stretch pt-2 text-xs">
      <dl className="flex w-full flex-col gap-4">
        {props.items
          .filter((item) => !!item)
          .map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <dt className="text-disabled">{key}</dt>
              <dd className="text-right font-medium">
                {value.includes("\n") ? (
                  <span className="text-right">
                    {value.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </span>
                ) : (
                  <p className="text-right">{value}</p>
                )}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

export default PolarizedList;
