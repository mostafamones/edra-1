"use client"

import { CreateAcademyStepper } from "@/components/create/stepper"
import LiquidEther from "@/components/LiquidEther"

export default function CreateAcademyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
        <LiquidEther
          mouseForce={20}
          cursorSize={100}
          colors={["#8200db", "#6e11b0", "#9810fa"]}
          autoDemo
          autoSpeed={0.3}
          autoIntensity={1.7}
          isBounce={false}
          resolution={0.5}
        />
      </div> */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <CreateAcademyStepper />
      </div>
    </div>
  )
}