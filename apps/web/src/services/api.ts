import type { AuthResponse, LoginProps, Note, CreateNoteInput, CreateUserDto, User } from "@nipponic/shared";
import { API_URL } from "@/lib/api-config";

export { API_URL };
export type { LoginProps };

export const registerUser = async (data: CreateUserDto): Promise<User> => {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let errorMessage = "Registration failed";
    try {
      if (typeof response.json === "function") {
        const errorData = await response.json();
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const login = async ({ email, password }: LoginProps): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    let errorMessage = "Authentication failed";
    try {
      if (typeof response.json === "function") {
        const errorData = await response.json();
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const fetchNotes = async (token: string): Promise<Note[] | void> => {
  return await fetch(`${API_URL}/notes`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => console.error(err));
};

export const createNote = async (
  token: string,
  noteData: CreateNoteInput
): Promise<Note | void> => {
  return await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(noteData),
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => console.error(err));
};
