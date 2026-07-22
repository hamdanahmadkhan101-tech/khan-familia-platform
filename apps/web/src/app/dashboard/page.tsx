import { redirect } from 'next/navigation';

/** Redirect bare /dashboard to the bookings page. */
export default function DashboardIndexPage() {
  redirect('/dashboard/bookings');
}
