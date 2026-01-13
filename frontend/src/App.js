import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/DashboardNew';
import Clients from './pages/Clients';
import Leads from './pages/Leads';
import Opportunities from './pages/Opportunities';
import SOWs from './pages/SOWs';
import Activities from './pages/Activities';
import EmployeesPerformance from './pages/EmployeesPerformance';
import Partners from './pages/Partners';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ClientOverview from './pages/ClientOverview';
import Projects from './pages/Projects';
import HiringRequests from './pages/HiringRequestsNew';
// NEW MODULES
import ActionItems from './pages/ActionItems';
import SalesActivity from './pages/SalesActivity';
import Forecast from './pages/Forecast';
import UserManagement from './pages/UserManagement';
import RFPDetails from './pages/RFPDetails';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Layout>
                  <Clients />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-overview"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientOverview />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/partners"
            element={
              <ProtectedRoute>
                <Layout>
                  <Partners />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployeesPerformance />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rfp-details"
            element={
              <ProtectedRoute>
                <Layout>
                  <RFPDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <Layout>
                  <Leads />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/opportunities"
            element={
              <ProtectedRoute>
                <Layout>
                  <Opportunities />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/action-items"
            element={
              <ProtectedRoute>
                <Layout>
                  <ActionItems />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-activity"
            element={
              <ProtectedRoute>
                <Layout>
                  <SalesActivity />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/forecast"
            element={
              <ProtectedRoute>
                <Layout>
                  <Forecast />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sow"
            element={
              <ProtectedRoute>
                <Layout>
                  <SOWs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <Layout>
                  <Activities />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <Projects />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/hiring-requests"
            element={
              <ProtectedRoute>
                <Layout>
                  <HiringRequests />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;