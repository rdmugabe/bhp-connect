import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect authenticated users from auth pages and home page
    if (token && (path === "/" || path.startsWith("/login") || path.startsWith("/register"))) {
      // If not approved, redirect to pending-approval
      if (token.approvalStatus !== "APPROVED") {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
      if (token.role === "BHP") {
        return NextResponse.redirect(new URL("/bhp", req.url));
      } else if (token.role === "BHRF") {
        return NextResponse.redirect(new URL("/facility", req.url));
      } else if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Allow unapproved users to access pending-approval page
    if (path === "/pending-approval") {
      if (token?.approvalStatus === "APPROVED") {
        // Approved users should go to their dashboard
        if (token.role === "BHP") {
          return NextResponse.redirect(new URL("/bhp", req.url));
        } else if (token.role === "BHRF") {
          return NextResponse.redirect(new URL("/facility", req.url));
        } else if (token.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
      return NextResponse.next();
    }

    // Block unapproved users from dashboard routes
    if (token && token.approvalStatus !== "APPROVED") {
      // Allow API auth routes and pending-approval page
      if (!path.startsWith("/api/auth") && path !== "/pending-approval") {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
    }

    // Admin routes - ADMIN role only
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Role-based access control
    if (path.startsWith("/bhp") && token?.role !== "BHP" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/facility") && token?.role !== "BHRF" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes
        if (
          path === "/" ||
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path.startsWith("/credentials/") ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/bhps/available")
        ) {
          return true;
        }

        // Pending approval page requires auth
        if (path === "/pending-approval") {
          return !!token;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
