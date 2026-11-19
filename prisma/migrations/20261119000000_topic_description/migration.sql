-- Short description of a Library topic (shown under its title in the Library list).
ALTER TABLE "Topic" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

-- Topics created before this change get a starting description (administrators can edit it).
UPDATE "Topic" SET "description" = 'Practica cómo saludar y presentarte en español.' WHERE "slug" = 'greetings' AND "description" = '';
UPDATE "Topic" SET "description" = 'Cuenta en español con juegos y canciones.' WHERE "slug" = 'numbers' AND "description" = '';
UPDATE "Topic" SET "description" = 'Identifica y nombra los colores en español.' WHERE "slug" = 'colors' AND "description" = '';
UPDATE "Topic" SET "description" = 'Reconoce y nombra las figuras en español.' WHERE "slug" = 'shapes' AND "description" = '';
UPDATE "Topic" SET "description" = 'Aprende los nombres de los animales en español.' WHERE "slug" = 'animals' AND "description" = '';
