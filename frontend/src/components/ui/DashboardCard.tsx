
import * as React from "react"
import { cn } from "@/lib/utils"

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    subtitle?: string
    action?: React.ReactNode
    noPadding?: boolean
}

export function DashboardCard({
    title,
    subtitle,
    action,
    noPadding = false,
    className,
    children,
    ...props
}: DashboardCardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md",
                className
            )}
            {...props}
        >
            {(title || action) && (
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div>
                        {title && (
                            <h3 className="text-base font-semibold text-slate-800">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-slate-500 mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={cn(noPadding ? "" : "p-4")}>
                {children}
            </div>
        </div>
    )
}
