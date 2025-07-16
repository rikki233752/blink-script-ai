import { MockAuthService } from "@/lib/mock-auth-service"

export interface SignupFormData {
  fullName: string
  email: string
  company?: string
  password: string
}

export class UserRegistrationService {
  private static instance: UserRegistrationService
  private authService: MockAuthService

  private constructor() {
    this.authService = MockAuthService.getInstance()
  }

  public static getInstance(): UserRegistrationService {
    if (!UserRegistrationService.instance) {
      UserRegistrationService.instance = new UserRegistrationService()
    }
    return UserRegistrationService.instance
  }

  async registerUser(userData: SignupFormData): Promise<void> {
    // Add the new user to the auth service
    await this.authService.addUser({
      id: `user-${Date.now()}`,
      email: userData.email,
      name: userData.fullName,
      role: "viewer", // Default role for new users
      password: userData.password,
      company: userData.company,
    })
  }
}

export const userRegistrationService = UserRegistrationService.getInstance()
