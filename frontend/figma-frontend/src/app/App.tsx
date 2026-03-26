import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { HostBookingsProvider } from './contexts/HostBookingsContext';

export default function App() {
  return (
    <AuthProvider>
      <HostBookingsProvider>
        <RouterProvider router={router} />
      </HostBookingsProvider>
    </AuthProvider>
  );
}