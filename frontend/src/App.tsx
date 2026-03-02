import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/Layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Settings from '@/pages/Settings'

// Base
import Users from '@/pages/users/Users'

// Core modules
import Leads from '@/pages/crm/Leads'
import LeadForm from '@/pages/crm/LeadForm'
import Products from '@/pages/inventory/Products'
import Employees from '@/pages/hr/Employees'

// Trading
import SalesOrders from '@/pages/sales/Orders'
import PurchaseOrders from '@/pages/purchasing/Orders'

// Medical
import Patients from '@/pages/medical/Patients'
import Appointments from '@/pages/medical/Appointments'
import Pharmacy from '@/pages/medical/Pharmacy'

// Manufacturing
import WorkOrders from '@/pages/manufacturing/WorkOrders'
import BOMList from '@/pages/manufacturing/BOMList'

// Accounting
import Invoices from '@/pages/accounting/Invoices'

// Quality & Companies
import Companies    from '@/pages/companies/Companies'
import QualityChecks from '@/pages/quality/QualityChecks'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />

          {/* CRM */}
          <Route path="/crm" element={<Leads />} />
          <Route path="/crm/leads/new" element={<LeadForm />} />
          <Route path="/crm/leads/:id" element={<LeadForm />} />

          {/* Inventory */}
          <Route path="/inventory" element={<Products />} />

          {/* HR */}
          <Route path="/hr" element={<Employees />} />

          {/* Sales */}
          <Route path="/sales" element={<SalesOrders />} />

          {/* Purchasing */}
          <Route path="/purchasing" element={<PurchaseOrders />} />

          {/* Medical */}
          <Route path="/medical/patients" element={<Patients />} />
          <Route path="/medical/appointments" element={<Appointments />} />
          <Route path="/medical/pharmacy" element={<Pharmacy />} />

          {/* Manufacturing */}
          <Route path="/manufacturing/work-orders" element={<WorkOrders />} />
          <Route path="/manufacturing/bom" element={<BOMList />} />

          {/* Accounting */}
          <Route path="/accounting" element={<Invoices />} />

          {/* Quality */}
          <Route path="/quality" element={<QualityChecks />} />

          {/* Companies & Users */}
          <Route path="/companies" element={<Companies />} />
          <Route path="/users" element={<Users />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
