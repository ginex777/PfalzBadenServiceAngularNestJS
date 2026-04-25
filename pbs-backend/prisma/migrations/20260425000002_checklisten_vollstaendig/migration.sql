-- Add kategorie column to checklisten_templates
ALTER TABLE "checklisten_templates" ADD COLUMN "kategorie" VARCHAR(100);

-- Create checklisten_template_objekte join table
CREATE TABLE "checklisten_template_objekte" (
    "template_id" BIGINT NOT NULL,
    "objekt_id" BIGINT NOT NULL,
    CONSTRAINT "checklisten_template_objekte_pkey" PRIMARY KEY ("template_id","objekt_id"),
    CONSTRAINT "checklisten_template_objekte_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklisten_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "checklisten_template_objekte_objekt_id_fkey" FOREIGN KEY ("objekt_id") REFERENCES "objekte"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
