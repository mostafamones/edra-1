"use client"

import { SiteHeader } from "@/components/site-header";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";


export default function EditStudentPage({ params }: { params: { id: string } }) {
  const { id } = params

  const [studentName, setStudentName] = useState<string>("Student")
  const crumbs = [{ label: "Students", href: "/students" }, { label: `Edit ${studentName}` }]

  return (
    <div className="flex flex-col h-full">
      <SiteHeader breadcrumb={crumbs} separator back={() => { console.log("back") }} />
      <div className="flex flex-1 h-full">
        <div className="w-full h-full">

        </div>
        <Separator orientation="vertical" className="h-full" />
        <div className="w-[20rem] h-full">

        </div>
      </div>
    </div>
  )
}