
import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-slate-100", className)}
            {...props}
        />
    )
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-10 w-[120px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 bg-white rounded-xl border border-slate-100 space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-4 w-[60px]" />
                        </div>
                        <Skeleton className="h-6 w-[100px]" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
                        <Skeleton className="h-6 w-[150px] mb-4" />
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-[60%]" />
                                    <Skeleton className="h-4 w-[40%]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
                        <Skeleton className="h-6 w-[150px] mb-4" />
                        <Skeleton className="h-[200px] w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export { Skeleton }
