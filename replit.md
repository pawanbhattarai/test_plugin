# HotelPro PMS - Property Management System

## Overview

HotelPro PMS is a comprehensive hotel property management system built with modern web technologies. It features multi-branch support, role-based access control, and integrated restaurant management capabilities. The system is designed to handle complex hotel operations including reservations, room management, guest services, billing, and restaurant operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom session-based authentication with Replit Auth integration
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **API Design**: RESTful API with comprehensive error handling
- **Real-time Updates**: WebSocket integration for live data synchronization

### Key Components

#### Core Hotel Management
- **Multi-Branch System**: Centralized management with branch isolation
- **Role-Based Access Control**: Three user roles (superadmin, branch-admin, front-desk)
- **Room Management**: Room types, availability tracking, and status management
- **Reservation System**: Complex multi-room reservations with flexible check-in/out dates
- **Guest Management**: Comprehensive guest profiles and history tracking
- **Billing System**: Integrated billing with tax calculations and payment processing

#### Restaurant Management Module
- **Table Management**: Restaurant table allocation and status tracking
- **Menu Management**: Categories and dishes with detailed specifications
- **Order Processing**: Kitchen order management with status tracking
- **Restaurant Billing**: Separate billing system for restaurant operations

#### Advanced Features
- **Push Notifications**: Web Push API integration with VAPID keys
- **Analytics Dashboard**: Comprehensive reporting and metrics
- **Bulk Operations**: Mass import/export capabilities
- **Real-time Sync**: WebSocket-based live updates
- **Mobile Responsive**: Optimized for all device sizes

## Data Flow

### Authentication Flow
1. User accesses the application
2. Session validation against PostgreSQL sessions table
3. User role and branch permissions determined
4. Route access controlled based on permissions
5. Replit Auth integration for external authentication

### Reservation Flow
1. Guest information capture and validation
2. Room availability checking across date ranges
3. Multi-room reservation creation with individual room assignments
4. Real-time room status updates
5. Billing calculation and payment processing

### Real-time Updates
1. WebSocket connection established on user authentication
2. Data changes broadcast to relevant branch users
3. Query cache invalidation triggers UI updates
4. Push notifications for critical events

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL (configurable via DATABASE_URL)
- **Authentication**: Replit Auth integration
- **Push Notifications**: Web Push API with VAPID keys
- **Payment Processing**: Stripe integration (configured)
- **Email Services**: SendGrid integration (configured)
- **Caching**: Redis support (configured)

### Development Tools
- **Database Management**: Drizzle Kit for migrations
- **Type Safety**: TypeScript throughout the stack
- **Code Quality**: ESLint and Prettier configurations
- **Build Optimization**: Vite with ESBuild for production builds

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit modules
- **Development Server**: Concurrent client and server with hot reloading
- **Database**: Local PostgreSQL or remote connection
- **Port Configuration**: Server on port 5000, exposed on port 80

### Production Deployment
- **Build Process**: Vite build for client, ESBuild for server
- **Deployment Target**: Autoscale deployment on Replit
- **Environment Variables**: Comprehensive configuration via .env
- **Database Migrations**: Automatic schema push on deployment

### Database Schema
- **Session Management**: PostgreSQL sessions table for authentication
- **Multi-tenant Architecture**: Branch-based data isolation
- **Comprehensive Schema**: Users, branches, rooms, guests, reservations, restaurant entities
- **Audit Trail**: Created/updated timestamps throughout

## Recent Changes
```
- June 21, 2025: Successfully migrated project from Replit Agent to Replit environment
- June 21, 2025: Updated Stock Item creation form with new layout including Opening Stock section with Quantity, Rate, and Value fields for better inventory management
- June 21, 2025: Implemented bulk add functionality for all inventory management following RMS pattern - Stock Categories, Measuring Units, Suppliers, and Stock Items now have dedicated bulk dialogs with proper state management
- June 21, 2025: Removed stock items/categories from restaurant orders section to keep inventory and restaurant management separate
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```