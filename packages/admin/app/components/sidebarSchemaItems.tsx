import {
  useGetDataQuery,
  useGetSchemaQuery,
} from "@/lib/store/slices/editorialApi";
import { NavLink } from "react-router";
import { SidebarMenuSub, SidebarMenuSubButton } from "./ui/sidebar";

export interface SidebarSchemaItemsProps {
  singleton?: boolean;
}

export default function SidebarSchemaItems({
  singleton,
}: SidebarSchemaItemsProps) {
  const { data: schema } = useGetSchemaQuery();
  const { data } = useGetDataQuery();

  if (!schema) return null;

  return (
    <>
      {Object.entries(schema)
        .filter(([, value]) => (singleton ? value.singleton : !value.singleton))
        .map(([key, value]) => {
          return (
            <SidebarMenuSub key={value.displayName}>
              <NavLink
                to={
                  singleton
                    ? `/admin/dashboard/${key}/default`
                    : `/admin/dashboard/${key}`
                }
                className={({ isActive, isPending }) =>
                  isPending ? "pending" : isActive ? "active" : ""
                }
              >
                {({ isActive }) => (
                  <SidebarMenuSubButton isActive={isActive} asChild>
                    <div>
                      <span className="inline-block overflow-hidden whitespace-nowrap text-ellipsis text-nowrap">
                        {value.displayName}
                      </span>

                      {!singleton && data && (
                        <span className="text-xs text-gray-500 ml-auto pr-1 min-w-[25px] text-right">
                          {Object.keys(data[key]).length}
                        </span>
                      )}
                    </div>
                  </SidebarMenuSubButton>
                )}
              </NavLink>
            </SidebarMenuSub>
          );
        })}
    </>
  );
}
