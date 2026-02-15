# BHP Connect

HIPAA-compliant behavioral health consulting platform for Arizona BHPs & BHRFs.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js with credentials + TOTP MFA
- **UI**: shadcn/ui + Tailwind CSS
- **File Storage**: AWS S3 (encrypted)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS S3 bucket (for document storage)

### Installation

1. Clone the repository and install dependencies:

```bash
cd bhp-connect
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
DATABASE_URL="postgresql://user:password@localhost:5432/bhp_connect"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-west-2"
AWS_S3_BUCKET="your-bucket-name"
```

3. Set up the database:

```bash
npx prisma db push
npx prisma generate
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features

### Authentication
- Secure credential-based authentication
- TOTP-based MFA (Two-Factor Authentication)
- Role-based access control (BHP, BHRF)

### BHP (Behavioral Health Professional) Features
- Dashboard with pending prescreens and compliance alerts
- Facility management (create, edit, assign operators)
- Credential management with expiration tracking
- Public credential page for verification
- Prescreen review and approval/denial
- Document requests from facilities
- Secure messaging with facilities

### BHRF (Behavioral Health Residential Facility) Features
- Dashboard with prescreen status and compliance health
- Prescreen submission (immutable after submission)
- Document upload in response to BHP requests
- View BHP credentials
- Secure messaging with BHP

### Security & Compliance
- All actions logged in audit trail
- Encrypted file storage (S3 with AES-256)
- Role-based route protection
- Data isolation between facilities

## Project Structure

```
bhp-connect/
├── app/
│   ├── (auth)/           # Auth pages (login, register, mfa-setup)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── bhp/          # BHP-specific pages
│   │   └── facility/     # BHRF-specific pages
│   ├── api/              # API routes
│   └── credentials/      # Public credential pages
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth components
│   └── dashboard/        # Dashboard components
├── lib/                  # Utilities (prisma, auth, s3, audit)
└── prisma/               # Database schema
```

## Database Schema

Key models:
- **User**: Authentication and profile
- **BHPProfile**: BHP-specific data and credentials
- **BHRFProfile**: BHRF linked to facility
- **Facility**: Residential facilities
- **Prescreen**: Admission prescreens
- **Document**: Facility compliance documents
- **Credential**: BHP credentials (licenses, certs)
- **Message**: Secure messaging
- **AuditLog**: Immutable audit trail

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:push    # Push schema to database
npm run db:generate # Generate Prisma client
npm run db:studio  # Open Prisma Studio
```

## License

Private - All rights reserved.
