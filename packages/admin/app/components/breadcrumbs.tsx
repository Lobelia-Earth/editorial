import { useGetSchemaQuery } from "@/lib/store/slices/editorialApi";
import { ChevronRight } from "lucide-react";
import React from "react";
import { NavLink, useLocation } from "react-router";

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const { data: schema } = useGetSchemaQuery();

  const filteredPathname = pathname
    .split("/")
    .filter((value) => !["admin", "dashboard"].includes(value) && value !== "");

  if (!schema) return null;

  return (
    <>
      {filteredPathname.map((value, index, array) => {
        return (
          <React.Fragment key={index}>
            {array.length > 1 && index >= 1 && (
              <ChevronRight size={12} className="text-gray-500 pt-[1px]" />
            )}
            <p
              key={value}
              className="text-sm leading-none tracking-tight capitalize text-gray-500 last:text-foreground"
            >
              {index < array.length - 1 &&
                schema[value] &&
                schema[value].singleton &&
                (schema[value] ? schema[value].displayName : value)}
              {index < array.length - 1 &&
                schema[value] &&
                !schema[value].singleton && (
                  <NavLink
                    to={`/admin/dashboard/${value}`}
                    className={({ isActive, isPending }) =>
                      isPending ? "pending" : isActive ? "active" : ""
                    }
                  >
                    {schema[value] ? schema[value].displayName : value}
                  </NavLink>
                )}
              {index === array.length - 1 &&
                (schema[value] ? schema[value].displayName : value)}
            </p>
          </React.Fragment>
        );
      })}
    </>
  );
}
