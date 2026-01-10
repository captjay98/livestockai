import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/lib/utils"

const TabsContext = React.createContext<{
    value: string
    onValueChange: (value: string) => void
} | null>(null)

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
    onValueChange: (value: string) => void
}

function Tabs({ value, onValueChange, className, ...props }: TabsProps) {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={cn("", className)} {...props} />
        </TabsContext.Provider>
    )
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
                className
            )}
            {...props}
        />
    )
}

function TabsTrigger({
    className,
    value,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
    const context = React.useContext(TabsContext)
    const isSelected = context?.value === value

    return (
        <button
            type="button"
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50 hover:text-foreground",
                className
            )}
            onClick={() => context?.onValueChange(value)}
            {...props}
        />
    )
}

function TabsContent({
    className,
    value,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
    const context = React.useContext(TabsContext)
    if (context?.value !== value) return null

    return (
        <div
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
