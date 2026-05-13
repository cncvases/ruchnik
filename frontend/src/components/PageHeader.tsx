interface Props {
  title: string
  right?: React.ReactNode
}

export function PageHeader({ title, right }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-40">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      {right && <div>{right}</div>}
    </header>
  )
}
