import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { loginUser } from "@/lib/store/slices/authSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginFormSchema = z.object({
  email: z.string().nonempty("Please enter your email").email(),
  password: z.string().nonempty("Please enter your password"),
  remember: z.boolean(),
});
export type LoginFormSchema = z.infer<typeof loginFormSchema>;

export default function LoginForm() {
  "use no memo";

  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  const form = useForm<LoginFormSchema>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = useCallback(
    ({ email, password, remember }: LoginFormSchema) => {
      dispatch(loginUser({ email, password, remember }));
    },
    [dispatch]
  );

  return (
    <div className="flex flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            rules={{ required: true }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex gap-1 items-baseline">
                  Email
                </FormLabel>
                <FormControl>
                  <Input placeholder="callasmaria@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="password"
            control={form.control}
            rules={{ required: true }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex gap-1 items-baseline">
                  Password
                </FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="remember"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label htmlFor="remember" className="text-sm leading-none">
                      Remember me
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={!form.formState.isValid || isLoading}
            className="w-full"
          >
            {isLoading ? <Spinner className="absolute" /> : "Login"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
