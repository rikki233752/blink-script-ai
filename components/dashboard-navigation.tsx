"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { navigation } from "@/app/navigation"

export function DashboardNavigation() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{item.description}</CardDescription>
              <Link href={item.href}>
                <Button className="w-full">Access {item.name}</Button>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
