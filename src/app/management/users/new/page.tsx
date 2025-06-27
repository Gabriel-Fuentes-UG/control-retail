import { redirect } from "next/navigation";

export default function NewUserPage() {
  // Si alguien accede directamente, lo mandamos a elegir tipo de usuario:
  redirect('/management/users/select-role');
}