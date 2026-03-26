import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { ConfirmAndPayPage } from "./pages/ConfirmAndPayPage";
import { BookingConfirmedPage } from "./pages/BookingConfirmedPage";
import { AuthoriseAndRequestPage } from "./pages/AuthoriseAndRequestPage";
import { RequestSentPage } from "./pages/RequestSentPage";
import { BookingDeclinedPage } from "./pages/BookingDeclinedPage";
import { MyTripsPage } from "./pages/MyTripsPage";
import { HostDashboardPage } from "./pages/HostDashboardPage";
import { ActiveStaysPage } from "./pages/ActiveStaysPage";
import { ActiveListingsPage } from "./pages/ActiveListingsPage";
import { UpcomingGuestsPage } from "./pages/UpcomingGuestsPage";
import { RejectedBookingsPage } from "./pages/RejectedBookingsPage";
import { PastStaysPage } from "./pages/PastStaysPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/search",
    Component: SearchResultsPage,
  },
  {
    path: "/listing/:id",
    Component: ListingDetailPage,
  },
  {
    path: "/booking/confirm-and-pay/:id",
    Component: ConfirmAndPayPage,
  },
  {
    path: "/booking/confirmed/:id",
    Component: BookingConfirmedPage,
  },
  {
    path: "/booking/authorise-and-request/:id",
    Component: AuthoriseAndRequestPage,
  },
  {
    path: "/booking/request-sent/:id",
    Component: RequestSentPage,
  },
  {
    path: "/booking/declined",
    element: <BookingDeclinedPage status="rejected" />,
  },
  {
    path: "/booking/expired",
    element: <BookingDeclinedPage status="expired" />,
  },
  {
    path: "/my-trips",
    Component: MyTripsPage,
  },
  {
    path: "/host/dashboard",
    Component: HostDashboardPage,
  },
  {
    path: "/host/active-stays",
    Component: ActiveStaysPage,
  },
  {
    path: "/host/active-listings",
    Component: ActiveListingsPage,
  },
  {
    path: "/host/upcoming-guests",
    Component: UpcomingGuestsPage,
  },
  {
    path: "/host/rejected-bookings",
    Component: RejectedBookingsPage,
  },
  {
    path: "/host/past-stays",
    Component: PastStaysPage,
  },
]);