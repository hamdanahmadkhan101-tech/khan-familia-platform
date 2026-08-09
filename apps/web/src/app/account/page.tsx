import { redirect } from 'next/navigation';

/** Redirect bare /account to the bookings page. */
export default function AccountPage() {
  redirect('/account/bookings');
}
