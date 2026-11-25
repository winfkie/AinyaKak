import { Composition } from "remotion";
import { CfdPromo, cfdPromoSchema } from "./CfdPromo";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="CfdPromo"
        component={CfdPromo}
        durationInFrames={30 * 22}
        fps={30}
        width={1080}
        height={1920}
        schema={cfdPromoSchema}
        defaultProps={{
          title: "CFD Semarang",
          subtitle: "Booking lapak 3x3 m tanpa ribet",
          cta: "Pilih Minggu • Pilih Lapak • Bayar QRIS",
          finalText: "amankan  tempatmu sekarang!",
        }}
      />
    </>
  );
};
