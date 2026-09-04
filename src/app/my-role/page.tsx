import { redirect } from "next/navigation";

export default function MyRolePage() {
  redirect("/project?view=my-task");
}
