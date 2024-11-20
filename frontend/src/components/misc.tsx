export const FlexRow = ({style, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div style={{display: 'flex', alignItems: 'center', ...style}} {...props} />
)
export const FlexCol = ({style, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div style={{display: 'flex', flexDirection: 'column', ...style}} {...props} />
)
