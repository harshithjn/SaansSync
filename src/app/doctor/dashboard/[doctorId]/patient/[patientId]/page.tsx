import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PatientDetail({
  params,
}: {
  params: Promise<{ doctorId: string; patientId: string }>
}) {
  const { doctorId, patientId } = await params

  return (
    <>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Patient ID: {patientId}
        </h2>

        <div className="space-x-2">
          <Button variant="outline">Export</Button>
          <Link
            href={`/doctor/dashboard/${doctorId}/patients/${patientId}/edit`}
          >
            <Button>Edit Patient</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="graphs">Graphs</TabsTrigger>
          <TabsTrigger value="meds">Medications</TabsTrigger>
          <TabsTrigger value="resp">Respiratory Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <p>Basic details, diagnosis, co-morbidities</p>
        </TabsContent>

        <TabsContent value="graphs">
          <p>SpO₂, trends, PFT graphs</p>
        </TabsContent>

        <TabsContent value="meds">
          <p>Medication list prescribed</p>
        </TabsContent>

        <TabsContent value="resp">
          <p>Oxygen / NIV / Ventilation details</p>
        </TabsContent>
      </Tabs>
    </>
  )
}
