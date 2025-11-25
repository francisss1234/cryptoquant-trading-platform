import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  defaultValue?: string
  children: React.ReactNode
  className?: string
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

const TabsContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const Tabs: React.FC<TabsProps> = ({ defaultValue, children, className }) => {
  const [value, setValue] = React.useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500", className)}>
      {children}
    </div>
  )
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className }) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext)
  const isActive = currentValue === value
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-white text-gray-950 shadow-sm",
        className
      )}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  )
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children, className }) => {
  const { value: currentValue } = React.useContext(TabsContext)
  
  if (currentValue !== value) return null
  
  return (
    <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }