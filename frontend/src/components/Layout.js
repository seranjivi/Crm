import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Target,
  TrendingUp,
  FileText,
  Activity,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  UserCog,
  FolderKanban
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Client', href: '/clients', icon: Building2 },
    { name: 'Client Overview', href: '/client-overview', icon: Users },
    { name: 'Sales Activity', href: '/sales-activity', icon: Activity },
    { name: 'Lead', href: '/leads', icon: Target },
    { 
      name: 'Opportunities', 
      href: '/opportunities', 
      icon: TrendingUp,
      subItems: [
        { name: 'All Opportunities', href: '/opportunities' },
        { name: 'RFP Details', href: '/rfp-details' }
      ]
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderKanban,
      children: [{ name: 'Hiring Request', href: '/projects/hiring-requests' }],
    },
    { name: 'Action Items', href: '/action-items', icon: Target },
    { name: 'User Management', href: '/user-management', icon: UserCog },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        } bg-[#0A2A43] text-white flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Logo */}
        <button
          onClick={() => {
            navigate('/dashboard');
            setSidebarOpen(false);
          }}
          className={`flex items-center ${
            sidebarCollapsed ? 'justify-center' : 'justify-between'
          } h-14 px-3 border-b border-white/10 hover:bg-white/5 transition-colors`}
          data-testid="home-logo-btn"
        >
          <div className={`flex items-center ${sidebarCollapsed ? '' : 'space-x-2'}`}>
            <img
              src="https://customer-assets.emergentagent.com/job_4424ce99-107e-4271-9ac9-bef9add8255c/artifacts/7ou0bag7_download.jpg"
              alt="SightSpectrum"
              className="h-7 w-7 rounded flex-shrink-0"
            />
            {!sidebarCollapsed && (
              <span className="text-lg font-bold font-['Manrope']">SightSpectrum</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(false);
            }}
            className="md:hidden text-white"
            data-testid="close-sidebar-btn"
          >
            <X size={20} />
          </button>
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            const isActive = location.pathname === item.href;
            const isChildActive = hasChildren
              ? item.children.some((c) => location.pathname === c.href)
              : false;
            const isGroupActive = isActive || isChildActive;

            if (!hasChildren && !item.subItems) {
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  title={sidebarCollapsed ? item.name : ''}
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'px-3'
                  } py-2 text-sm font-medium rounded-md transition-colors ${
                    isGroupActive
                      ? 'bg-[#2C6AA6] text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-2'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            }

            const groupOpen = item.name === 'Projects' ? projectsOpen : item.name === 'Opportunities' ? opportunitiesOpen : false;

            if (item.subItems) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => item.subItems && setOpportunitiesOpen(!opportunitiesOpen)}
                    className={`group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      item.subItems.some(subItem => location.pathname === subItem.href)
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        item.subItems.some(subItem => location.pathname === subItem.href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronDown 
                      className={`h-4 w-4 transform transition-transform ${
                        opportunitiesOpen ? 'rotate-180' : ''
                      }`} 
                      aria-hidden="true" 
                    />
                  </button>
                  {opportunitiesOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`block pl-8 pr-3 py-2 text-sm rounded-md ${
                            location.pathname === subItem.href
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={item.name}>
                <div
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'px-3'
                  } py-2 text-sm font-medium rounded-md transition-colors ${
                    isGroupActive
                      ? 'bg-[#2C6AA6] text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center flex-1 min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-2'}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                  {!sidebarCollapsed && (
                    <button
                      type="button"
                      className="ml-2 text-slate-200 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectsOpen(!projectsOpen);
                      }}
                      aria-label="Toggle Projects"
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${groupOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {!sidebarCollapsed && groupOpen && (
                  <div className="mt-1 space-y-0.5">
                    {item.children.map((child) => {
                      const childActive = location.pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`flex items-center px-8 py-1.5 text-sm rounded-md transition-colors ${
                            childActive
                              ? 'bg-white/10 text-white'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className="truncate">{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex items-center justify-center h-10 border-t border-white/10 hover:bg-white/5 transition-colors"
          data-testid="toggle-sidebar-btn"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={18} className="text-slate-300" />
          ) : (
            <ChevronLeft size={18} className="text-slate-300" />
          )}
        </button>

        {/* User Info Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-[#2C6AA6] text-white text-xs">
                  {user ? getInitials(user.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
                <p className="text-[10px] text-slate-400">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation - Compact */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-600"
              data-testid="open-sidebar-btn"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-slate-900 font-['Manrope']">Sales CRM</h1>
          </div>

          {/* User Dropdown - Compact */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#2C6AA6] rounded-md px-1.5 py-1"
                data-testid="user-menu-trigger"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-[#0A2A43] text-white text-xs">
                    {user ? getInitials(user.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-medium text-slate-900">{user?.full_name}</p>
                  <p className="text-[10px] text-slate-500">{user?.role}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                data-testid="profile-menu-item"
                className="cursor-pointer text-sm"
              >
                <User className="mr-2 h-3.5 w-3.5" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                data-testid="logout-menu-item"
                className="cursor-pointer text-red-600 focus:text-red-600 text-sm"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content - Compact */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
};

export default Layout;