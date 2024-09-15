export const FlexRow = ({style, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div style={{display: 'flex', alignItems: 'center', ...style}} {...props} />
)
