import { redirect } from "next/navigation"
// The settings form already covers display_name / bio / location editing,
// so /profile/edit simply reuses it to avoid two divergent forms.
export default function ProfileEditPage() {
  redirect("/settings")
}
