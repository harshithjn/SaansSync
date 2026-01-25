import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function EditPatient() {
  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-semibold">Add / Edit Patient</h2>

      {/* Basic Details */}
      <section className="space-y-3">
        <h3 className="font-medium">Basic Details</h3>
        <Input placeholder="Patient Name" />
        <Input placeholder="Mobile Number (Patient ID)" />
      </section>

      {/* Diagnosis */}
      <section className="space-y-3">
        <h3 className="font-medium">Diagnosis</h3>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select Diagnosis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asthma">Asthma</SelectItem>
            <SelectItem value="copd">COPD</SelectItem>
            <SelectItem value="ild">ILD</SelectItem>
            <SelectItem value="bronchiectasis">Bronchiectasis</SelectItem>
            <SelectItem value="posticu">Post ICU Discharge</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2">
          <Checkbox /> Cor Pulmonale
        </label>
      </section>

      {/* Respiratory Support */}
      <section className="space-y-3">
        <h3 className="font-medium">Respiratory Support</h3>

        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select Support Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ltot">LTOT</SelectItem>
            <SelectItem value="niv">BiPAP / NIV</SelectItem>
            <SelectItem value="vent">Invasive Ventilation</SelectItem>
            <SelectItem value="trach">Tracheostomy</SelectItem>
          </SelectContent>
        </Select>

        <Input placeholder="Oxygen (Litres)" type="number" />
        <Input placeholder="IPAP" type="number" />
        <Input placeholder="EPAP / PEEP" type="number" />
        <Input placeholder="FiO₂ (%)" type="number" />
      </section>

      <Button className="w-full">Save Changes</Button>
    </div>
  )
}
