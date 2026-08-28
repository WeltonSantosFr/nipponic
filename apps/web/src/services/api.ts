const API_URL = "http://localhost:3001";

interface LoginProps {
  email: string;
  password: string;
}

export const login = async ({ email, password }: LoginProps) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if(!response.ok) {
    throw new Error("Authentication failed")
  }

  return response.json()
};

export const fetchNotes = async (token:string) => {
  await fetch(`${API_URL}/notes`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => console.error(err));
};
