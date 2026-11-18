"use client";

import { useEffect, useState } from "react";
import type { FolderColorDef } from "@/lib/folders";

// Folder labels in English and Spanish. They follow the interface language the teacher chose
// (the same setting as the activity editor, remembered on this device); without a choice they
// follow the page language, like the rest of My Activities.
const EN = {
  newFolder: "New folder",
  newFolderButton: "+ New folder",
  editFolder: "Edit folder",
  name: "Name",
  namePlaceholder: "Colores, Grade 2, Unit 1…",
  nameRequired: "Write a name for the folder.",
  nameTooLong: "Use 60 characters or fewer.",
  colour: "Colour",
  selected: "selected",
  preview: "Preview",
  previewEmpty: "Folder name",
  cancel: "Cancel",
  create: "Create folder",
  creating: "Creating…",
  save: "Save changes",
  saving: "Saving…",
  failed: "The folder could not be saved. Your changes are still here. Try again.",
  notFound: "This folder no longer exists. Close this window and reload the page.",
  badColour: "Choose one of the colours.",
  options: (name: string) => `Options for folder ${name}`,
  deleteFolder: "Delete folder",
  colourName: (c: FolderColorDef): string => c.label,
};
export type FolderStrings = typeof EN;

const ES: FolderStrings = {
  newFolder: "Nueva carpeta",
  newFolderButton: "+ Nueva carpeta",
  editFolder: "Editar carpeta",
  name: "Nombre",
  namePlaceholder: "Colores, 2.º grado, Unidad 1…",
  nameRequired: "Escribe un nombre para la carpeta.",
  nameTooLong: "Usa 60 caracteres o menos.",
  colour: "Color",
  selected: "seleccionado",
  preview: "Vista previa",
  previewEmpty: "Nombre de la carpeta",
  cancel: "Cancelar",
  create: "Crear carpeta",
  creating: "Creando…",
  save: "Guardar cambios",
  saving: "Guardando…",
  failed: "No se pudo guardar la carpeta. Tus cambios siguen aquí. Inténtalo de nuevo.",
  notFound: "Esta carpeta ya no existe. Cierra esta ventana y recarga la página.",
  badColour: "Elige uno de los colores.",
  options: (name: string) => `Opciones de la carpeta ${name}`,
  deleteFolder: "Eliminar carpeta",
  colourName: (c: FolderColorDef) => c.es,
};

export function useFolderStrings(): FolderStrings {
  const [lang, setLang] = useState<"en" | "es">("en");
  useEffect(() => {
    let l: string | null = null;
    try {
      l = localStorage.getItem("sls-ui-lang");
    } catch {}
    if (l !== "es" && l !== "en") l = document.documentElement.lang?.toLowerCase().startsWith("es") ? "es" : "en";
    setLang(l as "en" | "es");
  }, []);
  return lang === "es" ? ES : EN;
}
