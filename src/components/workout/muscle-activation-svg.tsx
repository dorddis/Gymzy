'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { SVGProps } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Muscle, MUSCLE_VOLUME_THRESHOLDS } from '@/lib/constants';

import FrontFullBody from '@/assets/images/front-full-body-with-all-muscles-showing.svg';
import BackFullBody from '@/assets/images/back-full-body-with-all-muscles-showing.svg';

interface MuscleActivationSVGProps {
  muscleVolumes?: Partial<Record<Muscle, number>>;
  className?: string;
  scrollElementRef?: React.RefObject<HTMLElement>;
}

/**
 * Given a numeric volume, return activation level + Tailwind‐class color.
 */
const getMuscleActivationLevel = (
  volume: number | undefined
): { level: 'Low' | 'Medium' | 'High' | 'None'; opacity: number } => {
  if (volume === undefined || volume === 0) {
    return { level: 'None', opacity: 0 };
  }
  if (volume < MUSCLE_VOLUME_THRESHOLDS.LOW) {
    return { level: 'Low', opacity: 0.3 };
  }
  if (volume < MUSCLE_VOLUME_THRESHOLDS.MEDIUM) {
    return { level: 'Medium', opacity: 0.6 };
  }
  return { level: 'High', opacity: 1.0 };
};

/**
 * Map from Muscle enum → one or more `<g id="...">` strings
 * for the *back*‐view SVG.  Each key is a Muscle enum, and each RHS is
 * either a single string (one `<g>`) or an array of strings (if the
 * "muscle" is actually split into multiple sub‐IDs in the SVG).
 */
const backMuscleIdMap: Partial<Record<Muscle, string | string[]>> = {
  [Muscle.Rhomboids]: 'Rhomboid_major_00000153702420119838252620000014513967375993411263_',
  [Muscle.Hamstrings]: [
    'Semimembranosis_00000165197940537239056910000018339456362161962915_',
    'Semi_Tendinosis_00000142172608923587160350000008002679039365734793_',
    'Upper_inner_hamstring_00000155141996103184447130000003953608675083121284_',
    'Biceps_Femoris_00000110447600570690947540000000638541115458994341_',
  ],
  [Muscle.Trapezius]: 'Trapz_00000086658569290832975040000006959360490215844261_',
  [Muscle.LowerTrapezius]: 'Middle_and_lower_trapz_00000011030372104423980000000004308217814190120081_',
  [Muscle.LatissimusDorsi]: 'Lats_00000133492815442984477070000001790843316009520005_',
  [Muscle.Deltoid]: 'Delts_00000037683310307467639390000007902456789317736638_',
  [Muscle.TeresMajor]: 'Teres_Major_00000116932973775553672460000017841647355507566270_',
  [Muscle.Infraspinatus]: 'Infraspinatus_00000055693351133629568060000011005395473393824395_',
  [Muscle.TricepsBrachii]: 'Triceps_00000058563430122785195830000004356675806786654858_',
  [Muscle.Obliques]: [
    'Obliques_00000144307680268788205310000005818624216599975297_',
    'Upper_obliques_00000163063841218330492000000005773978221908945313_',
  ],
  [Muscle.Forearms]: [
    'Extensor_carpi_00000116200407099860938660000003262073282377889712_',
    'Extensor_digitorum_00000071523930808613392550000017694714289508163976_',
    'Extensor_carpi_ulnaris_00000134217785543749064480000005604883019983209609_',
    'Flexor_digitorium__x28_Under_arm_x29__00000159435954906204878840000011072027011836770979_',
  ],
  [Muscle.GluteusMaximus]: 'Gluteus_maximus_00000168110655002960868070000014188754410659059374_',
  [Muscle.GluteusMedius]: 'Gluteus_medius_00000112621038774864745760000016539011443425383349_',
  [Muscle.ThoracolumbarFascia]: 'Thoracolumbar_00000067950730854538543580000014263760795646897319_',
  [Muscle.Soleus]: [
    'Soleus_00000162330102282724997570000015371067798349489321_',
    'Soleus_00000162330102282724997570000015371067798349489349489321_',
  ],
  [Muscle.Calves]: 'Claves_00000142896635816991424760000005189009876859777974_',
  [Muscle.Quadriceps]: 'Outer_quads_00000121269285701693319920000012886749065288244405_',
};

/**
 * Front‐view map—using the `<g id="…">` strings from your *front* SVG.
 */
const frontMuscleIdMap: Partial<Record<Muscle, string | string[]>> = {
  [Muscle.PectoralisMajor]: 'Pecs_00000113330972391601112060000005331138571180189576_',
  [Muscle.UpperRectusAbdominis]: 'Upper_abs_00000046315355844623453780000011985032790848095113_',
  [Muscle.LowerRectusAbdominis]: [
    'Lower_abs_upper_00000119081192880914562810000012168525010772388750_',
    'Lower_abs_00000109003454546266000020000013768254758986680995_',
  ],
  [Muscle.Obliques]: 'Obliques_external_00000132808153117246191410000008142061127064473252_',
  [Muscle.SerratusAnterior]: 'Serratus_Anterior_00000078742877783113189840000003461162299842308526_',
  [Muscle.GluteusMedius]: 'Gluteus_medius_00000080201568885703178310000010756533600557290409_',
  [Muscle.GluteusMaximus]: 'Gluteus_maximus_00000168110655002960868070000014188754410659059374_',
  [Muscle.Quadriceps]: [
    'Outer_quads_00000121269285701693319920000012886749065288244405_',
    'Inner_quads_00000130614576889879192780000002899524873876548237_',
    'Inner_quads_00000132084545112020286850000018311130309988591026_',
    'Mid_quad_00000159455298854971660020000007518134995342161842_',
  ],
  [Muscle.Sartorius]: 'Sartorius__x28_inner_leg_x29__00000060747210191620450210000000874795006996621474_',
  [Muscle.AdductorMagnus]: 'Pectinius__x28_Inner_groin_muscle_x29__00000139279253852462966920000017582585951695724936_',
  [Muscle.PeroneusLongus]: 'Peroneus_longus_00000062179120547177543840000016909121641372359095_',
  [Muscle.Soleus]: 'Soleus_00000181065268647695928680000018209480433536768399_',
  [Muscle.Calves]: [
    'Calves__x28_medial_head_x29__00000152234539263550023980000009007724782308122012_',
    'Calves__x28_medial_head_x29__00000144309093221821848954800000014225574352369808823_',
    'Calves__x28_medial_head_x29__00000034059829512782314760000010611914542469866172_',
    'Calves__x28_medial_head_x29__00000116931660906523261270000008161269292030177950_',
    'Calves__x28_medial_head_x29__00000165214869862005764650000008485716200638106512_',
  ],
  [Muscle.Forearms]: [
    'Extensor__x28_fore_arm_lower_x29__00000012468373894602770780000006966979348039066248_',
    'Flexor_digitorium__x28_Under_arm_x29__00000159435954906204878840000011072027011836770979_',
  ],
  [Muscle.Brachioradialis]: 'Brachioradialis__x28_fore_arm_upper_x29__00000132086081680176933160000000575656365073902269_',
  [Muscle.Brachialis]: 'Biceps_Brachialis_00000003086861433688303320000017820228468836316309_',
  [Muscle.Sternocleidomastoid]: [
    'Sternocleids_00000000901235046718923910000008305278881673465734_',
    'Scm_00000050638738960208808000000011068059099103715510_',
  ],
  [Muscle.Trapezius]: 'Front_traps_00000021839012028885905390000000215930882222765978_',
  [Muscle.TricepsBrachii]: [
    'Triceps_long_head_00000083776378062729911360000007780280132728440204_',
    'triceps_lateral_head_00000114039035336761946620000010495095347100091037_',
  ],
  [Muscle.BicepsBrachii]: 'Biceps_brachii_00000165913426772514415860000005830889273115133587_',
  [Muscle.AnteriorDeltoid]: 'Deltoids_front_00000075869929722435460100000017330691835694619786_',
  [Muscle.LateralDeltoid]: 'Deltoids_side_00000075869929722435460100000017330691835694619787_',
  [Muscle.PosteriorDeltoid]: 'Deltoids_back_00000075869929722435460100000017330691835694619788_',
};

/**
 * MuscleActivationSVG
 *  - Displays the full-body SVG with muscle activation.
 *  - Implements scroll-blur effect and tappable functionality.
 */
export function MuscleActivationSVG({ muscleVolumes = {}, className, scrollElementRef }: MuscleActivationSVGProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const svgRef = useRef<SVGSVGElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const BodySvg = view === 'front' ? FrontFullBody : BackFullBody;
  const currentMuscleIdMap = view === 'front' ? frontMuscleIdMap : backMuscleIdMap;

  // Initialize all muscles with 0 if undefined
  const safeMuscleVolumes = useMemo(() => {
    const volumes: Record<Muscle, number> = {} as Record<Muscle, number>;
    // Initialize all muscles from the enum
    Object.values(Muscle).forEach((muscle) => {
      if (typeof muscle === 'string') {
        volumes[muscle as Muscle] = 0;
      }
    });
    // Override with actual values from muscleVolumes if it exists
    if (muscleVolumes && typeof muscleVolumes === 'object') {
      Object.entries(muscleVolumes).forEach(([muscle, volume]) => {
        if (typeof muscle === 'string' && muscle in Muscle) {
          volumes[muscle as Muscle] = volume ?? 0;
        }
      });
    }
    return volumes;
  }, [muscleVolumes]);

  // Get relevant muscles (those with volume > 0)
  const relevantMuscles = useMemo(() => {
    return Object.entries(safeMuscleVolumes)
      .filter(([_, volume]) => volume > 0)
      .map(([muscle]) => muscle as Muscle);
  }, [safeMuscleVolumes]);

  const applyMuscleActivation = useCallback(() => {
    if (!svgRef.current) return;

    const allGroupIds: string[] = Object.values(currentMuscleIdMap).reduce<string[]>((acc, maybeId) => {
      if (!maybeId) return acc;
      return acc.concat(Array.isArray(maybeId) ? maybeId : [maybeId]);
    }, []);

    // First, hide all muscles to reset opacities
    allGroupIds.forEach((groupId) => {
      const g = svgRef.current!.querySelector<SVGGElement>(`#${groupId}`);
      if (g) g.style.opacity = '0';
    });

    // Then, apply activation opacities to relevant muscles
    relevantMuscles.forEach((muscle) => {
      const maybeId = currentMuscleIdMap[muscle];
      if (!maybeId) return;

      const groupIds: string[] = Array.isArray(maybeId) ? maybeId : [maybeId];
      const volume = safeMuscleVolumes[muscle];
      const activation = getMuscleActivationLevel(volume);

      groupIds.forEach((groupId) => {
        const g = svgRef.current!.querySelector<SVGGElement>(`#${groupId}`);
        if (g) g.style.opacity = `${activation.opacity}`;
      });
    });
  }, [view, safeMuscleVolumes, relevantMuscles, currentMuscleIdMap]);

  useEffect(() => {
    applyMuscleActivation();
  }, [applyMuscleActivation]);

  useEffect(() => {
    const scrollElement = scrollElementRef?.current || window;
    const handleScroll = () => {
      setScrollPosition(scrollElement === window ? window.scrollY : (scrollElement as HTMLElement).scrollTop);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollElementRef]);

  const blurAmount = Math.min(scrollPosition / 100, 5);
  const opacityAmount = Math.max(0.5, 1 - scrollPosition / 200);

  // Temporary logging for debugging blur effect
  useEffect(() => {
    console.log("Scroll Position:", scrollPosition);
    console.log("Blur Amount:", blurAmount);
    console.log("Opacity Amount:", opacityAmount);
  }, [scrollPosition, blurAmount, opacityAmount]);

  return (
    <div className={`relative ${className || ''}`}>
      {/* Background SVG with blur effect */}
      <div
        className="absolute inset-0 z-0 transition-all duration-300 ease-out"
        style={{ filter: `blur(${blurAmount}px)`, opacity: opacityAmount }}
        onClick={() => setIsModalOpen(true)}
      >
        <BodySvg ref={svgRef} className="w-full h-full" />
      </div>

      {/* View toggle button - now outside the blurred background */}
      <Button
        className="absolute top-2 right-4 z-20 bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium h-8 hover:bg-primary/90 active:bg-primary/80 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setView(prevView => prevView === 'front' ? 'back' : 'front');
          if (svgRef.current) {
            const svg = svgRef.current;
            svg.style.opacity = '0';
            setTimeout(() => {
              svg.style.opacity = '1';
              applyMuscleActivation();
            }, 50);
          }
        }}
        aria-label={view === 'front' ? 'Show Back View' : 'Show Front View'}
      >
        {view === 'front' ? 'Show Back' : 'Show Front'}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Muscle Activation Details</DialogTitle>
            <DialogDescription>Detailed view of activated muscles.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <BodySvg ref={svgRef} className="w-full h-full" />
            <div className="mt-4 w-full">
              {relevantMuscles.map((muscle) => {
                const volume = safeMuscleVolumes[muscle];
                const { level } = getMuscleActivationLevel(volume);
                if (level === 'None') return null;
                return (
                  <div key={muscle} className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium">{muscle}</span>
                    <span className={`text-xs font-semibold ${level === 'Low' ? 'text-green-500' : level === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {level} ({volume.toFixed(0)} kg)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 